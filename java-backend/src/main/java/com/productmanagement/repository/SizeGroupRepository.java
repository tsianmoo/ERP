package com.productmanagement.repository;

import com.productmanagement.entity.SizeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SizeGroupRepository extends JpaRepository<SizeGroup, Integer> {
    
    List<SizeGroup> findAllByOrderBySortOrderAsc();
    
    @Query("SELECT sg FROM SizeGroup sg LEFT JOIN FETCH sg.sizeValues ORDER BY sg.sortOrder ASC")
    List<SizeGroup> findAllWithValuesOrderBySortOrder();
}
